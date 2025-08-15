# WhatIsThis - Multi-functional Language Learning Platform

A Flask-based web application for language learning, offering novel reading, vocabulary management, image annotation, and group learning features.

## 🚀 Quick Start

### Requirements
- Python 3.8+
- Flask
- SQLite3

### Install Dependencies
```bash
pip install flask requests duckduckgo-search werkzeug
```

### Start the Application
```bash
cd backend/app
python main.py
```

The app will run at `http://localhost:5000`.

## 📁 Project Structure

```
├── README.md
├── backend/                    # Backend application
│   └── app/
│       ├── main.py            # Entry point
│       ├── config/            # Configuration module
│       │   └── config.py      # Main config file
│       ├── models/            # Data models
│       │   ├── database.py    # Database management
│       │   └── tag/           # Tag management module
│       ├── routes/            # API routes
│       │   ├── app.py         # Basic page routes
│       │   ├── novel.py       # Novel management API
│       │   ├── annotation.py  # Image annotation API
│       │   ├── group.py       # Group learning API
│       │   ├── vocb.py        # Vocabulary management API
│       │   └── translation.py # Translation service API
│       └── service/           # Business services
│           ├── dictionary.py  # Dictionary service
│           └── translation_service.py # Translation service
├── frontend/                  # Frontend resources
│   ├── static/               # Static assets
│   │   ├── css/             # Stylesheets
│   │   └── js/              # JavaScript modules
│   └── templates/           # HTML templates
│       ├── nav.html         # Navigation page
│       ├── NovelReader.html # Novel reader
│       ├── Annotation.html  # Image annotation tool
│       ├── LWG.html         # Group learning
│       └── WordCards.html   # Vocabulary cards
├── data/                     # Data storage
│   ├── *.db                 # SQLite databases
│   ├── novel/               # Novel files
│   ├── annotations/         # Image annotation data
│   └── group/               # Group learning data
└── test/                    # Test files
  └── run_tests.py
```

## 🎯 Main Features

### 1. Novel Reader
- **Path**: `/novel-reader`
- **Features**: 
  - Manage novel chapters (create, update, delete)
  - Multi-language support (original and translated versions)
  - Read chapter content
  - Create and manage novels

### 2. Image Annotation Tool
- **Path**: `/annotation`
- **Features**:
  - Upload and manage images
  - Create annotation items
  - Edit and delete annotation data
  - Annotation history

### 3. Learn With Groups
- **Path**: `/lwg`
- **Features**:
  - DAG (Directed Acyclic Graph) management
  - Create and edit learning nodes
  - Visualize learning paths
  - Group collaborative learning

### 4. Vocabulary Management
- **Features**:
  - Vocabulary tag management
  - Query vocabulary details
  - Dictionary integration
  - Vocabulary filtering and categorization

### 5. Translation Service
- **Features**:
  - Text translation API
  - Batch translation
  - Multi-language support
  - Translation caching

### 6. Learn With Images
- **Path**: `/lwi`
- **Status**: 🚧 Needs refactoring
- **Features**: Context-based image learning

### 7. Word Cards
- **Path**: `/word-cards`
- **Features**: Vocabulary flashcard system

## 🛠️ API Endpoints

### Novel Management API
- `GET /novel/list` - Get all novels
- `GET /novel/<name>/chapters` - Get novel chapters
- `POST /novel/create` - Create a new novel
- `POST /novel/<name>/chapters/update` - Update chapters

### Annotation Management API
- `GET /annotations` - Get annotation items
- `POST /annotations` - Create new annotation item
- `PUT /annotations/<id>` - Update annotation item
- `DELETE /annotations/<id>` - Delete annotation item

### Group Learning API
- `GET /group` - Get DAG list
- `POST /group/add` - Add new DAG
- `POST /group/update/<name>` - Update DAG
- `POST /group/delete/<name>` - Delete DAG

### Vocabulary Management API
- `GET /api/vocb/tags` - Get all tags
- `POST /api/vocb/tags` - Add new tag
- `GET /api/vocb/word/<word>` - Get vocabulary details

## 💾 Database

The application uses SQLite databases:
- `en_dict.db` - English dictionary data
- `en_phonetic.db` - English phonetic data
- `img_cache.db` - Image cache data

## 🔧 Configuration

Main configuration is in `backend/app/config/config.py`:
- Data directory path
- Database file paths
- Template and static asset paths
- Supported language settings

## 🧪 Testing

To run tests:
```bash
cd test
python run_tests.py
```

## 📱 PWA Support

The app supports Progressive Web App (PWA) features:
- Service Worker (`sw.js`)
- Web App Manifest (`site.webmanifest`)
- Offline cache support

## 🌐 Multi-language Support

Supported languages:
- English (en)
- Chinese (zh)
- Other languages can be added via configuration

## 🚧 Development Status

- ✅ Novel Reader - Full features
- ✅ Image Annotation - Full features  
- ✅ Group Learning - Full features
- ✅ Vocabulary Management - Full features
- ✅ Translation Service - Full features
- 🚧 Learn With Images - Needs refactoring

## 📞 Contact

For questions or suggestions, please create an Issue or submit a Pull Request.
