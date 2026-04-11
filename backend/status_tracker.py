# Singleton to track status across different modules
class StatusTracker:
    def __init__(self):
        self.status = {
            "step": 0,
            "message": "Idle",
            "details": ""
        }

    def update(self, step=None, message=None, details=None):
        if step is not None: self.status["step"] = step
        if message is not None: self.status["message"] = message
        if details is not None: self.status["details"] = details
        print(f"STATUS UPDATE: {self.status['message']} - {self.status['details']}")

    def get(self):
        return self.status

tracker = StatusTracker()
