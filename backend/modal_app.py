import modal
from modal import App, Image, Secret, asgi_app

app = App("subscription-manager")

image = Image.debian_slim().pip_install_from_requirements("requirements.txt")

@app.function(
    image=image,
    secrets=[Secret.from_name("neon-db-url")],
    container_idle_timeout=300,
)
@asgi_app()
def fastapi_app():
    from main import app
    return app