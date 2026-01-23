# Travel Copilot

A FastAPI-based travel assistant application that helps users find hotels using AI-powered search and recommendations.

## Features

- **Hotel Search**: Search for hotels in any city using DuckDuckGo integration
- **AI-Powered Recommendations**: Leverages OpenAI GPT-4 Turbo for intelligent hotel recommendations
- **Real-time Chat**: WebSocket-based real-time communication with Socket.IO
- **Hotel Details Panel**: Interactive panel showing structured hotel information with ratings, prices, and amenities
- **Dynamic Content**: Generates hotel images, descriptions, and price estimates

## Tech Stack

- **Backend**: FastAPI with Python 3.9
- **Real-time**: Socket.IO and Python-SocketIO
- **AI/ML**: LangChain, OpenAI GPT-4 Turbo
- **Search**: DuckDuckGo API
- **Frontend**: HTML, CSS, JavaScript with Socket.IO client
- **Server**: Uvicorn with hot reload

## Prerequisites

- Python 3.9+
- pip or conda
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Pouladzadeh/Travel-Copilot.git
cd Travel-Copilot
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
export OPENAI_API_KEY="your-api-key-here"
```

## Running the Application

1. Activate the virtual environment:
```bash
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Start the server:
```bash
cd perienv
python run.py
```

3. Open your browser and navigate to:
```
http://127.0.0.1:8000
```

## Usage

1. Ask the Travel Copilot about hotels in any city
2. Examples:
   - "Find hotels in Miami"
   - "Show me hotels in Paris"
   - "I want hotels in Tokyo from August 1 to August 7"

3. View hotel details in the right panel:
   - Star ratings
   - Guest reviews
   - Prices per night
   - Amenities and features
   - Official website links

## Project Structure

```
Travel-Copilot/
├── run.py              # Main FastAPI application
├── requirements.txt    # Python dependencies
├── static/            # Static files (CSS, images)
│   ├── styles.css
│   └── img/           # SVG icons and images
├── templates/         # HTML templates
│   └── index.html     # Main application interface
└── README.md          # This file
```

## API Endpoints

- `GET /`: Main application interface
- `WebSocket /socket.io/`: Real-time communication

## Socket.IO Events

### Client → Server
- `user_message`: Send a message to the AI assistant

### Server → Client
- `bot_reply`: AI response to user message
- `hotels_update`: Hotel data for display in the panel

## Future Enhancements

- Database integration for user preferences
- Booking integration with major platforms
- Multi-language support
- Advanced filters (price range, amenities, ratings)
- User authentication and saved preferences
- Image generation for hotel visuals

## License

MIT License

## Author

Parvaneh Pouladzadeh

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
