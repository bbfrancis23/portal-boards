from slowapi import Limiter
from slowapi.util import get_remote_address

# Basic abuse protection: counts requests per client IP, in this process's memory.
# Routes opt in with @limiter.limit(...); see AUTH_LIMIT for the log-in routes.
limiter = Limiter(key_func=get_remote_address)

# Plenty for a person logging in, too few for a script hammering the log-in routes.
AUTH_LIMIT = "10/minute"
