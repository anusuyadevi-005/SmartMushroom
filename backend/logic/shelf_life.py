from datetime import datetime, timedelta

def calculate_shelf_life(temp, humidity):
    # base shelf life (in days)
    base_days = 10

    # reduce days based on conditions
    if temp > 30:
        base_days -= 3
    if humidity > 80:
        base_days -= 2

    if base_days < 1:
        base_days = 1

    expiry_date = datetime.now() + timedelta(days=base_days)

    status = "SAFE"
    if base_days <= 2:
        status = "WARNING"
    if base_days == 1:
        status = "EXPIRED"

    return expiry_date, status
