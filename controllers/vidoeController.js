const fs = require('node:fs');
const { execSync: exec } = require('child_process');
const { Deepgram } = require('@deepgram/sdk');
const ffmpegStatic = require('ffmpeg-static');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const { supabase } = require('../libs/supabase');

const deepgram = new Deepgram(process.env.DEEPGRAM_KEY ?? '');

// Update user details
const ffmpeg = async (command) => {
  return new Promise((resolve, reject) => {
    exec(`${ffmpegStatic} ${command}`, (err, stderr, stdout) => {
      if (err) reject(err);
      resolve(stdout);
    });
  });
};

const deepgramTranscribe = async (filePath, file) => {
  try {
    //console.log(filePath, file);
    const video = fs.readFileSync(filePath);
    //console.log(video)
    const response = await deepgram.transcription.preRecorded(
      {
        buffer: video,
        mimetype: 'video/webm',
      },
      { smart_format: true, utterances: true }
    );

    const stream = fs.createWriteStream('output.vtt', { flags: 'a' });
    //const stream = fs.createWriteStream('output.srt', { flags: 'a' })

    stream.write(response.toWebVTT());
    //  Following code herestream.write(response.toWebVTT())
  } catch (error) {
    console.log({ error });
  }
};

exports.uploadVideo = catchAsync(async (req, res, next) => {
  const videoFile = req.file;
  const filePath = videoFile?.path ?? '';

  ffmpeg(`-hide_banner -y -i ${filePath} ${filePath}.mp3`);

  const audioFile = {
    buffer: fs.readFileSync(`${filePath}.mp3`),
    mimetype: 'audio/mp3',
  };

  const response = await deepgram.transcription.preRecorded(audioFile, {
    punctuation: true,
    utterances: true,
  });

  const stream = fs.createWriteStream(`${filePath}.vtt`, { flags: 'a' });
  stream.write(response.toWebVTT());

  const video = await supabase
    .from('videos')
    .insert({
      file_path: filePath,
      subtitle_path: `${filePath}.vtt`,
    })
    .select();

  fs.unlink(`${filePath}.mp3`, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
      return;
    }
    console.log('File deleted successfully');
  });

  res.status(201).json({
    status: 'success!',
    video,
  });
});

exports.getVideo = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const video = await supabase.from('videos').select('*').eq('id', id).single();

  res.status(200).json({
    video,
  });
});

exports.getVideos = catchAsync(async (req, res, next) => {
  const videos = await supabase.from('videos').select('*');

  res.status(200).json({
    videos,
  });
});
