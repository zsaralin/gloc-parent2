import os


# 🔧 Replace this with your folder path
folder = "c:/users/admin/videos"
files_to_delete = [
    "2025-05-01 14-43-36.avi",
    "2025-05-01 14-53-04.mp4",
    "2025-05-01 14-53-47.mp4"
]


file_path = "c:/users/admin/videos/2025-05-01 14-43-36.avi"

if os.path.exists(file_path):
    os.remove(file_path)
    print("File deleted successfully.")
else:
    print("File does not exist.")
