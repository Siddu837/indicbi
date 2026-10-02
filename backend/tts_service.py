import edge_tts
import base64
import os
import io

VOICE_MAP = {
    'hi': 'hi-IN-SwaraNeural',
    'hi-IN': 'hi-IN-SwaraNeural',
    'te': 'te-IN-ShrutiNeural',
    'te-IN': 'te-IN-ShrutiNeural',
    'ta': 'ta-IN-PallaviNeural',
    'ta-IN': 'ta-IN-PallaviNeural',
    'kn': 'kn-IN-SapnaNeural',
    'kn-IN': 'kn-IN-SapnaNeural',
    'gu': 'gu-IN-DhwaniNeural',
    'gu-IN': 'gu-IN-DhwaniNeural',
    'en': 'en-IN-NeerjaNeural',
    'en-IN': 'en-IN-NeerjaNeural',
    'auto': 'hi-IN-SwaraNeural'
}

async def generate_neural_audio_base64(text: str, lang: str = 'hi-IN') -> str:
    """
    Generates studio-quality Microsoft Neural Voice audio in Base64 MP3 format.
    Works natively across Indian languages (Hindi, Telugu, Tamil, Kannada, Gujarati, English).
    """
    voice = VOICE_MAP.get(lang, VOICE_MAP.get(lang.split('-')[0], 'hi-IN-SwaraNeural'))
    try:
        communicate = edge_tts.Communicate(text, voice)
        audio_stream = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_stream.write(chunk["data"])
        
        audio_bytes = audio_stream.getvalue()
        if audio_bytes:
            b64_audio = base64.b64encode(audio_bytes).decode('utf-8')
            return f"data:audio/mp3;base64,{b64_audio}"
    except Exception as e:
        print(f"Neural TTS Error: {e}")
    return ""
