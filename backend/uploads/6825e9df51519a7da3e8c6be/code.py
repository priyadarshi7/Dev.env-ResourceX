import numpy as np

def estimate_coefficients(x, y):
    n = np.size(x)
    mean_x = np.mean(x)
    mean_y = np.mean(y)

    SS_xy = np.sum(y*x) - n*mean_y*mean_x
    SS_xx = np.sum(x*x) - n*mean_x*mean_x

    b_1 = SS_xy / SS_xx
    b_0 = mean_y - b_1*mean_x

    return (b_0, b_1)

def linear_regression(x, y):
    b_0, b_1 = estimate_coefficients(x, y)
    
    y_predicted = b_0 + b_1 * x
    return y_predicted
    
x = np.array([1, 2, 3, 4, 5])
y = np.array([2, 4, 5, 4, 5])

predicted_values = linear_regression(x, y)
print("Predicted values:", predicted_values)

b_0, b_1 = estimate_coefficients(x,y)
print("Intercept:", b_0)
print("Slope:", b_1)