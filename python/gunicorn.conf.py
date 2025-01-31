workers = 2  # Adjust based on available memory
worker_class = 'sync'  # Use 'gevent' for async if compatible
timeout = 120
max_requests = 100  # Restart workers periodically to avoid leaks