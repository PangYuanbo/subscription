import modal
from modal import App, Image, Secret, asgi_app

app = App("subscription-manager")

image = (
    Image.debian_slim()
    .pip_install_from_requirements("requirements.txt")
    .copy_local_file("main.py", "/root/main.py")
    .copy_local_file("database.py", "/root/database.py")
    .copy_local_file("models.py", "/root/models.py")
    .copy_local_file("schemas.py", "/root/schemas.py")
)

@app.function(
    image=image,
    secrets=[Secret.from_name("neon-db-url")],
    scaledown_window=300,
)
@asgi_app()
def fastapi_app():
    from main import app
    return app