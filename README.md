# Bangalore Metro Timings - PWA

A Progressive Web App for planning metro journeys and viewing schedules for Bangalore Namma Metro. This is a hobby project based on the information provided in https://www.bmrc.co.in/metro-timings/ and https://www.bmrc.co.in/schematic-route-map/. Do not expect support.

Access live site [here](https://sumitanvekar.github.io/bangalore-metro-tools/).

If you are interested to fix the timings, feel free to raise a pull request.

## Features

- 🗺️ **Journey Planner** - Find optimal routes with transfers between any two stations
- 🚇 **Next Train Finder** - Get real-time next train information based on current time
- 📅 **Schedule Viewer** - View complete timetables for all metro lines

## Tech Stack

- **Build Tool**: Vite 5.x - Fast HMR and optimized production builds
- **Framework**: Vanilla JavaScript with Web Components
- **CSS**: Tailwind CSS (via CDN)
- **PWA**: vite-plugin-pwa with Workbox for offline support
- **Data**: JSON files with comprehensive route and schedule data

## Development

### Quick Start

```bash
# Install dependencies
npm install

# Start development server with Vite
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server will automatically open at `http://localhost:8000` with hot module replacement (HMR) enabled.

### Project Structure

```
bangalore-metro-timings/
├── public/
│   ├── data/              # JSON data files
│   ├── icons/             # App icons
│   └── manifest.json      # PWA manifest
├── src/
│   ├── index.html         # Main HTML
│   ├── styles/            # CSS files
│   └── js/
│       ├── app.js         # App initialization
│       ├── components/    # Web Components (UI)
│       ├── services/      # Business logic
│       ├── utils/         # Utility functions
│       └── data/          # Data management
```

## Features in Detail

### Journey Planner
- Breadth-First Search (BFS) algorithm for optimal route finding
- Handles direct routes and routes with up to 2 transfers
- Shows estimated travel time (3 min per station + 5 min per transfer)
- Displays line colors and direction information

### Next Train Finder
- Supports both frequency-based (Purple/Green) and fixed schedule (Yellow) lines
- Auto-detects current day type (Monday/Weekday/Saturday/Sunday)
- Color-coded urgency levels:
  - 🔴 Red: < 5 minutes (urgent)
  - 🟡 Yellow: 5-15 minutes (soon)
  - 🟢 Green: > 15 minutes (normal)
- Auto-refreshes every minute

### Schedule Viewer
- View schedules by line and day type
- Shows first/last trains for key stations
- Displays frequency patterns throughout the day
- Fixed departure times for Yellow line

## Hosting
Hosted using github pages.

## Data Last Updated

2026-03-14

## Contributing

This is a personal project for Bangalore metro commuters. Contributions welcome!

## License

MIT

## Disclaimer

All timings are approximate. For exact schedules, please verify at metro stations or the official [BMRCL](https://www.bmrc.co.in) website.
