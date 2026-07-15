// 1. Start ngrok in a terminal: ngrok http 5000
// 2. Copy the HTTPS URL provided (e.g., https://a1b2-c3d4.ngrok-free.app)
// 3. Paste it below:

// Option A: Use your local IP address (Make sure phone and computer are on the same Wi-Fi)
// export const API_URL = 'http://192.168.1.7:5000/api';

// Option B: Use localtunnel (uncomment if you want to use localtunnel)
// export const API_URL = 'https://shiny-beers-stop.loca.lt/api';

// Option C: Use ngrok (uncomment if you want to use ngrok)
// export const API_URL = 'https://aileen-fructuous-pseudocourteously.ngrok-free.dev/api';

// Option D: Use hosted Render backend
export const API_URL = 'https://textileflow-backend.onrender.com/api';

export const BASE_URL = API_URL;

// Dynamically resolves local development file paths to the active backend domain
export const resolveImageUri = (uri) => {
    if (!uri) return null;
    
    // If it's a relative path, append the active backend URL
    if (uri.startsWith('/')) {
        const baseUrl = API_URL.replace('/api', '');
        return `${baseUrl}${uri}`;
    }
    
    // If the database URL points to a local address, but we are connected to Render (or another active backend),
    // dynamically swap the host so the phone can load the file from the current active server.
    if (uri.includes('localhost:') || uri.includes('10.0.2.2:') || uri.includes('192.168.')) {
        const baseUrl = API_URL.replace('/api', '');
        const uploadPathIndex = uri.indexOf('/uploads/');
        if (uploadPathIndex !== -1) {
            const path = uri.substring(uploadPathIndex);
            return `${baseUrl}${path}`;
        }
    }
    
    return uri;
};

// NOTE: Every time you restart ngrok, this URL changes and must be updated here.
