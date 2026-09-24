# Indian Sign Language Translator

A real-time Indian Sign Language (ISL) translator that uses a camera to recognize hand gestures and convert them into text and speech.

## About the Project

This project is built to help bridge the communication gap between people who use Indian Sign Language and people who may not understand it.

The system takes live video from a camera, detects the person and their hands, tracks important landmarks, and uses deep learning models to understand the sequence of gestures. The recognized signs are then converted into text and can also be spoken using text-to-speech.

## How It Works

```text
Camera
  ↓
OpenCV
  ↓
YOLOv11s
  ↓
MediaPipe
  ↓
Feature Extraction
  ↓
Deep Learning Models
  ↓
Gesture Recognition
  ↓
Text Generation
  ↓
Text-to-Speech
```

## Technologies Used


## Main Features



## Project Workflow

The camera first captures the user's movements. OpenCV processes the video frames, while YOLOv11s is used to detect the person and hands.

MediaPipe then extracts important landmarks from the hands, face and shoulders. These landmarks are converted into feature sequences and passed to the deep learning models.

The models identify the gestures, and the recognized signs are combined to form a sentence. If the prediction confidence is too low, the system can avoid producing an unreliable result.

Finally, the translated sentence is displayed as text and can be converted into speech.

## Models

The project uses and compares three approaches:

**CNN-LSTM**
Used to learn spatial features along with the movement of gestures over time.

**Transformer**
Used to capture relationships between different frames in a gesture sequence.

**LSTM-Attention**
Uses LSTM to understand the sequence while attention helps focus on the more important parts of the gesture.

## Applications

* Real-time ISL translation
* Accessibility applications
* Sign language learning
* Educational tools
* Communication assistance
* Human-computer interaction

## Current Status

The project is currently under development. Work is being done on improving gesture recognition, model performance, sentence formation and real-time translation.

## Future Improvements

* Add more ISL gestures
* Improve recognition in different lighting conditions
* Support longer continuous sentences
* Improve grammar correction
* Improve real-time performance
* Add multilingual translation
* Deploy the system as a web or desktop application


