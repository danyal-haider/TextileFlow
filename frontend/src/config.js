// 1. Start ngrok in a terminal: ngrok http 5000
// 2. Copy the HTTPS URL provided (e.g., https://a1b2-c3d4.ngrok-free.app)
// 3. Paste it below:

// Option A: Use your local IP address (Make sure phone and computer are on the same Wi-Fi)
// export const API_URL = 'http://192.168.1.7:5000/api';

// Option B: Use localtunnel (uncomment if you want to use localtunnel)
// export const API_URL = 'https://shiny-beers-stop.loca.lt/api';

// Option C: Use ngrok (uncomment if you want to use ngrok)
export const API_URL = 'https://aileen-fructuous-pseudocourteously.ngrok-free.dev/api';

export const BASE_URL = API_URL;

// NOTE: Every time you restart ngrok, this URL changes and must be updated here.
