from sklearn.linear_model import LinearRegression
import numpy as np

# Input data
X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2, 4, 5, 4, 5])

# Create and train the model
model = LinearRegression()
model.fit(X, y)

# Make predictions
predicted = model.predict(X)

# Output results
print("Predictions:", predicted)
print("Slope (coefficient):", model.coef_[0])
print("Intercept:", model.intercept_)
