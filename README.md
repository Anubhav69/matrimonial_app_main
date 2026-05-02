# Express.js Application

A basic Express.js web application.

## Installation

Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
.
├── src/
│   └── index.js          # Main server file
├── package.json          # Project dependencies and scripts
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## API Endpoints

- `GET /` - Welcome message
- `GET /api/hello` - Returns a hello message

## Dependencies

- **express** - Web framework for Node.js
- **nodemon** - Development server with auto-reload (dev dependency)
