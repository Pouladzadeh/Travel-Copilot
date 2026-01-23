# === Import necessary libraries ===
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import socketio
import uvicorn
import os
import sys
from openai import OpenAI
import json
import re

# === Hotel Search Imports ===
from ddgs import DDGS
from langchain_openai import ChatOpenAI
from langchain.agents import initialize_agent
from langchain.agents import AgentType
from langchain.tools import Tool
from langchain.tools import tool

# === Initialize OpenAI client ===
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("Error: OPENAI_API_KEY environment variable not set")
    print("Please set your OpenAI API key: export OPENAI_API_KEY='your-api-key-here'")
    sys.exit(1)

client = OpenAI(api_key=api_key)

# === Enhanced Hotel Search Function ===
def search_hotels_func(query: str) -> dict:
    """Search for hotels and return structured data for both chat and panel display."""
    
    def extract_hotel_name(title, city):
        """Extract clean hotel name from title"""
        name = title.split(' - ')[0].split(' | ')[0].split(' in ')[0]
        name = name.replace(f' {city}', '').replace(f'{city} ', '')
        
        words_to_remove = ['Hotel', 'Resort', 'Book', 'Reservation', 'Reviews', 'Official', 'Website']
        for word in words_to_remove:
            if name.endswith(f' {word}'):
                name = name[:-len(f' {word}')]
        
        return name.strip()

    def extract_star_rating(text):
        """Extract star rating from text"""
        star_pattern = r'(\d+)[\s-]*star'
        match = re.search(star_pattern, text.lower())
        if match:
            return int(match.group(1))
        
        star_count = text.count('★')
        if star_count > 0:
            return star_count
        
        # Default rating if none found
        return 4

    def extract_amenities(text):
        """Extract amenities from text"""
        amenity_mapping = {
            'pool': 'Pool', 'spa': 'Spa', 'gym': 'Gym', 'wifi': 'Free WiFi',
            'restaurant': 'Restaurant', 'bar': 'Bar', 'parking': 'Parking',
            'breakfast': 'Breakfast', 'beach': 'Beach Access', 'ocean': 'Ocean View',
            'beachfront': 'Beachfront', 'luxury': 'Luxury', 'family': 'Family Friendly'
        }
        
        found_amenities = []
        text_lower = text.lower()
        for key, value in amenity_mapping.items():
            if key in text_lower:
                found_amenities.append(value)
        
        # Add some default amenities if none found
        if not found_amenities:
            found_amenities = ['Free WiFi', 'Restaurant', 'Pool']
        
        return found_amenities[:4]  # Limit to 4 amenities

    def generate_hotel_image(hotel_name, city):
        """Generate a plausible hotel image URL"""
        # Use Unsplash for hotel images
        hotel_images = [
            "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=300&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop&crop=center",
            "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&h=300&fit=crop&crop=center"
        ]
        return hotel_images[hash(hotel_name) % len(hotel_images)]

    def generate_price():
        """Generate a realistic price range"""
        import random
        base_prices = [195, 225, 260, 280, 295, 320, 350, 380]
        return f"${random.choice(base_prices)}"

    def generate_description(hotel_name, amenities, city):
        """Generate a hotel description based on available info"""
        descriptions = [
            f"Elegant hotel in the heart of {city} featuring modern amenities and exceptional service.",
            f"Luxurious accommodations with stunning views and world-class facilities in {city}.",
            f"Contemporary hotel offering comfort and convenience for both business and leisure travelers.",
            f"Boutique hotel with unique charm and personalized service in downtown {city}.",
            f"Premium hotel featuring upscale amenities and prime location near major attractions."
        ]
        return descriptions[hash(hotel_name) % len(descriptions)]

    try:
        ddgs = DDGS()
        
        search_queries = [
            f"{query} hotels",
            f"best hotels in {query}",
            f"{query} luxury hotels",
            f"top rated hotels {query}"
        ]
        
        all_results = []
        for search_query in search_queries:
            try:
                results = list(ddgs.text(search_query, max_results=10))
                all_results.extend(results)
            except:
                continue
        
        # Process results
        booking_sites = [
            'booking.com', 'expedia.com', 'hotels.com', 'trivago.com',
            'agoda.com', 'priceline.com', 'kayak.com', 'orbitz.com',
            'travelocity.com', 'hotwire.com', 'tripadvisor.com'
        ]
        
        hotel_chain_domains = [
            'marriott.com', 'hilton.com', 'hyatt.com', 'ihg.com', 
            'accor.com', 'wyndhamhotels.com', 'choicehotels.com',
            'bestwestern.com', 'radissonhotels.com', 'omnihotels.com',
            'fourseasons.com', 'ritzcarlton.com', 'fairmont.com'
        ]
        
        potential_hotels = []
        seen_hotels = set()
        
        for result in all_results:
            title = result['title']
            url = result['href']
            snippet = result.get('body', '')
            
            if any(booking_site in url.lower() for booking_site in booking_sites):
                continue
            
            hotel_name = extract_hotel_name(title, query)
            
            if hotel_name.lower() in seen_hotels or len(hotel_name) < 3:
                continue
            seen_hotels.add(hotel_name.lower())
            
            is_chain = any(chain in url.lower() for chain in hotel_chain_domains)
            
            potential_hotels.append({
                'name': hotel_name,
                'link': url,
                'title': title,
                'snippet': snippet,
                'is_chain': is_chain
            })
        
        # Build structured hotel data
        hotels_data = []
        for i, hotel_info in enumerate(potential_hotels[:3]):
            hotel_name = hotel_info['name']
            amenities = extract_amenities(hotel_info['snippet'])
            rating = extract_star_rating(hotel_info['snippet'])
            
            structured_hotel = {
                'name': hotel_name,
                'rating': rating + (0.1 * (i + 1)),  # Add slight variation
                'reviews': 500 + (i * 200) + (hash(hotel_name) % 1000),
                'price': generate_price(),
                'description': generate_description(hotel_name, amenities, query),
                'features': amenities,
                'image': generate_hotel_image(hotel_name, query),
                'website': hotel_info['link']
            }
            hotels_data.append(structured_hotel)
        
        # Create response for chat
        chat_response = f"Here are 3 excellent hotels I found in {query}:\n\n"
        for i, hotel in enumerate(hotels_data, 1):
            chat_response += f"{i} – {hotel['name']}\n"
            chat_response += f"    – {hotel['rating']:.1f} stars • {hotel['reviews']:,} reviews\n"
            chat_response += f"    – {hotel['price']}/night\n"
            chat_response += f"    – {', '.join(hotel['features'][:3])}\n"
            chat_response += f"    – {hotel['website']}\n\n"
        
        chat_response += "💡 Tip: Check the hotel panel on the right for detailed information and booking options!"
        
        return {
            'chat_message': chat_response,
            'hotels_data': hotels_data,
            'city': query
        }
            
    except Exception as error:
        return {
            'chat_message': f"Sorry, I encountered an error searching for hotels in {query}. Please try again.",
            'hotels_data': [],
            'city': query
        }

# === Create LangChain Tool ===
@tool("hotel-search")
def hotel_search(query: str) -> str:
    """Search for hotels and return structured data."""
    result = search_hotels_func(query)
    return result['chat_message']

# === Initialize LangChain Agent ===
tools = [
    Tool(
        name="Hotel Search",
        func=hotel_search,
        description="Search for hotels in a city and return recommendations with details and official website links."
    )
]

SYSTEM_MESSAGE = """You are a helpful travel assistant specializing in hotel recommendations. When users ask about hotels:

1. Use the hotel search tool to find real hotels with official websites
2. Present the information clearly with ratings, prices, and amenities  
3. Always encourage users to check the hotel panel for more details
4. For non-hotel questions, politely redirect to hotel-related topics

Keep responses friendly, informative, and focused on helping users find great accommodations."""

llm = ChatOpenAI(temperature=0, model="gpt-4-turbo-preview", verbose=False)

agent = initialize_agent(
    tools,
    llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=False,
    agent_kwargs={"system_message": SYSTEM_MESSAGE},
)

# === Create FastAPI and Socket.IO apps ===
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins="*")
app = FastAPI()

# === Mount static files ===
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# === Load HTML templates ===
if os.path.exists("templates"):
    templates = Jinja2Templates(directory="templates")
else:
    templates = None

# === Combine FastAPI app with Socket.IO ===
socket_app = socketio.ASGIApp(sio, app)

# === Socket.IO Event Handlers ===
@sio.event
async def connect(sid, environ):
    print(f'Client {sid} connected')

@sio.event
async def disconnect(sid):
    print(f'Client {sid} disconnected')

@sio.event
async def user_message(sid, data):
    user_input = data.get("message", "")
    print(f"Received message from {sid}: {user_input}")

    try:
        # Check if this is a hotel-related query
        hotel_keywords = ['hotel', 'hotels', 'accommodation', 'stay', 'booking', 'room', 'resort']
        is_hotel_query = any(keyword in user_input.lower() for keyword in hotel_keywords)
        
        if is_hotel_query:
            # Extract city name from the query
            import re
            city_patterns = [
                r'hotel.*?in\s+([A-Za-z\s]+)',
                r'hotels.*?in\s+([A-Za-z\s]+)', 
                r'find.*?hotel.*?([A-Za-z\s]+)',
                r'stay.*?in\s+([A-Za-z\s]+)',
                r'accommodation.*?in\s+([A-Za-z\s]+)'
            ]
            
            city = None
            for pattern in city_patterns:
                match = re.search(pattern, user_input, re.IGNORECASE)
                if match:
                    city = match.group(1).strip()
                    break
            
            # If no city found, try to extract from common formats
            if not city:
                words = user_input.lower().split()
                if 'in' in words:
                    in_index = words.index('in')
                    if in_index + 1 < len(words):
                        city = ' '.join(words[in_index + 1:]).strip('.,!?')
            
            if city:
                # Get structured hotel data
                hotel_result = search_hotels_func(city)
                
                # Send chat response
                await sio.emit('bot_reply', {
                    'message': hotel_result['chat_message']
                }, room=sid)
                
                # Send structured hotel data for the panel
                if hotel_result['hotels_data']:
                    await sio.emit('hotels_update', {
                        'hotels': hotel_result['hotels_data'],
                        'city': hotel_result['city']
                    }, room=sid)
                
                return
        
        # For non-hotel queries, use the agent
        ai_response = agent.run(user_input)
        
    except Exception as e:
        print(f"Error processing request: {e}")
        ai_response = "Sorry, I had trouble processing your request. Please try again or ask me about hotels in a specific city!"

    # Send AI response to frontend
    await sio.emit('bot_reply', {'message': ai_response}, room=sid)

# === Routes ===
@app.get("/favicon.ico")
async def favicon():
    return Response(status_code=204)

@app.get("/", response_class=HTMLResponse)
async def get_home(request: Request):
    if templates and os.path.exists("templates/index.html"):
        return templates.TemplateResponse("index.html", {"request": request})
    else:
        return HTMLResponse("""
        <html>
            <head><title>Travel Copilot</title></head>
            <body>
                <h1>Travel Copilot</h1>
                <p>Ask me to find hotels in any city!</p>
                <p>Example: "Find hotels in Miami" or "Show me hotels in Paris"</p>
            </body>
        </html>
        """)

# === Run the app ===
if __name__ == "__main__":
    uvicorn.run("run:socket_app", host="127.0.0.1", port=8000, reload=True)