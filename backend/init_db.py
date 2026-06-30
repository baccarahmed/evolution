import sys
import os

# Add the project root to sys.path to allow absolute imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import engine, Base
from backend import models

print("Création de la base de données et des tables...")
Base.metadata.create_all(bind=engine)
print("Base de données et tables créées avec succès.")
