import cv2

# Input video path
video_path = './dist/video.mp4'
# Output image path
output_image_path = 'placeholder.jpg'

# Open the video file
cap = cv2.VideoCapture(video_path)

# Read the first frame
ret, frame = cap.read()

if ret:
    # Save the frame as an image
    cv2.imwrite(output_image_path, frame)
    print(f"First frame saved to {output_image_path}")
else:
    print("Failed to read the first frame.")

# Release the video capture object
cap.release()
