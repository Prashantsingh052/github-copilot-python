from flask import Flask

from sudoku_app.game_state import get_current_game_state
from sudoku_app.routes import main


def create_app():
    app = Flask(__name__)
    app.register_blueprint(main)
    return app


app = create_app()
CURRENT = get_current_game_state()


if __name__ == '__main__':
    app.run(debug=True)
