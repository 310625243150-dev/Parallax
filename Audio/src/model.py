from pathlib import Path

import numpy as np
from sklearn.ensemble import RandomForestClassifier


class HeartSoundModel:
    """
    Prototype ML model interface for EchoAssist.

    IMPORTANT:
    This prototype is not a clinically validated diagnostic model.
    A real classifier must be trained using a properly labeled dataset.
    """

    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            random_state=42
        )

        self.is_trained = False

    def train(self, X, y):
        """
        Train the model using labeled feature vectors.
        """

        X = np.asarray(X)
        y = np.asarray(y)

        self.model.fit(X, y)

        self.is_trained = True

    def predict(self, features):
        """
        Predict using a trained model.
        """

        if not self.is_trained:
            raise RuntimeError(
                "Model has not been trained. "
                "Provide a labeled dataset first."
            )

        features = np.asarray(features).reshape(1, -1)

        prediction = self.model.predict(features)[0]

        probabilities = self.model.predict_proba(features)[0]

        confidence = float(np.max(probabilities))

        return {
            "prediction": str(prediction),
            "confidence": round(confidence, 3),
            "model": "EchoAssist Prototype RF v1"
        }


if __name__ == "__main__":

    print("EchoAssist ML Model")
    print("-------------------")

    model = HeartSoundModel()

    print("Model type: Random Forest")
    print("Status: Ready for labeled training data")
    print()
    print("IMPORTANT:")
    print("This is a prototype model interface.")
    print("It is NOT a clinically validated diagnostic model.")
    