from flask_socketio import SocketIO

# central Socket.IO server instance. Initialized in app.py via init_app
socketio = SocketIO(cors_allowed_origins="http://localhost:3000", async_mode='eventlet')

@socketio.on('connect')
def handle_connect():
    print('Client connected to Socket.IO')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected from Socket.IO')
