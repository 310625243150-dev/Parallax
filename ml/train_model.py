import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline


# ============================================================
# CONFIGURATION
# ============================================================

DATASET_FILE = "ml/data/physionet_dataset.csv"
MODEL_FILE = "ml/models/heart_sound_model.pkl"


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("ECHOASSIST MODEL TRAINING")
print("=" * 60)

df = pd.read_csv(DATASET_FILE)

print("Dataset loaded")
print("Total recordings:", len(df))


# ============================================================
# PREPARE FEATURES AND LABELS
# ============================================================

feature_columns = [
    column
    for column in df.columns
    if column.startswith("feature_")
]

X = df[feature_columns]
y = df["label"]


print("Number of features:", len(feature_columns))
print()
print("Class distribution:")
print(y.value_counts())


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print()
print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))


# ============================================================
# MODEL
# ============================================================

model = Pipeline([
    (
        "scaler",
        StandardScaler()
    ),
    (
        "classifier",
        RandomForestClassifier(
            n_estimators=200,
            random_state=42,
            class_weight="balanced"
        )
    )
])


# ============================================================
# TRAIN
# ============================================================

print()
print("Training model...")

model.fit(
    X_train,
    y_train
)

print("Training completed!")


# ============================================================
# EVALUATION
# ============================================================

predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    predictions
)

print()
print("=" * 60)
print("MODEL EVALUATION")
print("=" * 60)

print("Accuracy:", round(accuracy, 4))

print()
print("Classification Report:")
print(
    classification_report(
        y_test,
        predictions
    )
)

print()
print("Confusion Matrix:")
print(
    confusion_matrix(
        y_test,
        predictions
    )
)


# ============================================================
# SAVE MODEL
# ============================================================

os.makedirs(
    os.path.dirname(MODEL_FILE),
    exist_ok=True
)

joblib.dump(
    model,
    MODEL_FILE
)

print()
print("=" * 60)
print("MODEL SAVED")
print("=" * 60)

print(MODEL_FILE)