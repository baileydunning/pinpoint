
# Pinpoint

Pinpoint is a geography guessing game built with React, TypeScript, and Tailwind CSS. Players are presented with a random location and must guess where it is on the map. The app provides feedback on accuracy, tracks player statistics, and supports saving and reviewing locations.

## Features

- Random location puzzles using real-world map data
- Interactive satellite and world maps
- Place a guess and receive accuracy feedback
- Zoom controls for map detail (zoom usage affects scoring)
- Performance tiers based on guess accuracy
- Statistics panel: rounds played, best/worst/median distances, countries visited, continent distribution
- Save and review locations
- Light/dark theme with system detection
- Fast, animated user interface

## Getting Started

### Prerequisites
- Node.js (v18 or newer)
- npm
- HarperDB (for backend)

### Setup Instructions
1. Install HarperDB globally:
  ```sh
  npm i -g harperdb
  ```
2. Change into the `web` directory:
  ```sh
  cd web
  ```
3. Install dependencies:
  ```sh
  npm install
  ```
4. Build the project:
  ```sh
  npm run build
  ```
5. Start the development server:
  ```sh
  npm run dev
  ```
6. The app will be available at [http://localhost:9926](http://localhost:9926)
