from decouple import config


class Config:
    SECRET_KEY = config("SECRET_KEY", default="your-default-secret-key")
    SQLALCHEMY_DATABASE_URI = config("DATABASE_URL", default="sqlite:///app.db")
    MAIL_SERVER = "smtp.gmail.com"
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = config("MAIL_USERNAME", default=None)
    MAIL_PASSWORD = config("MAIL_PASSWORD", default=None)
    MAIL_DEFAULT_SENDER = MAIL_USERNAME

    if not MAIL_USERNAME or not MAIL_PASSWORD:
        raise ValueError(
            "The senders GMAIL MAIL_USERNAME and MAIL_PASSWORD must be set."
        )
