import React, { useState } from 'react';
import { isMobileDevice } from '../utils/deviceDetection';

interface Channel {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  url: string;
}

const LiveView: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const channels: Channel[] = [
    {
      id: 'nbc',
      name: 'NBC News Live',
      description: 'Breaking news and live coverage (US)',
      thumbnail: 'https://i.ytimg.com/vi/NetjXEFKKZ8/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAexORabwBqsyaZgKMujWl-52ck3g',
      url: 'WvWbmr3vx9o'
    },
    {
      id: 'abc',
      name: 'ABC News Live',
      description: 'Breaking news and live coverage (US)',
      thumbnail: 'https://s.abcnews.com/images/Live/abc_news_live-abc-ml-250210_1739199021469_hpMain_16x9_608.jpg',
      url: 'iipR5yUp36o'
    },
    {
      id: 'bloomberg',
      name: 'Bloomberg Live',
      description: 'Business and financial news (US)',
      thumbnail: 'https://media.licdn.com/dms/image/v2/D4E12AQHTB3nZ041KFw/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1726691799400?e=2147483647&v=beta&t=P1HOtxHxRqqcgkiJ30OMb6ftQkA5r1vFB8bAc2nfUTw',
      url: 'iEpJwprxDdk'
    }
  ];

  if (selectedChannel) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          {/* Stream Player */}
          <div className="glass-panel rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedChannel.thumbnail}
                  alt={selectedChannel.name}
                  className="w-12 h-12 rounded-lg object-contain bg-white/10"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center"><span class="text-white font-bold text-xl">' + selectedChannel.name.charAt(0) + '</span></div>';
                  }}
                />
                <div>
                  <h2 className="text-2xl font-bold">{selectedChannel.name}</h2>
                  <p className="text-slate-400">{selectedChannel.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChannel(null)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                ← Back to Channels
              </button>
            </div>

            <div className="relative bg-black rounded-xl overflow-hidden" style={{paddingBottom: '56.25%'}}>
              <iframe
                src={`https://www.youtube.com/embed/${selectedChannel.url}?autoplay=1&mute=${isMobileDevice() ? 1 : 0}&controls=0&modestbranding=1&rel=0&showinfo=0&disablekb=1&fs=1`}
                title={selectedChannel.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                style={{border: 'none'}}
              />
            </div>
          </div>

          {/* Attribution Info */}
          <div className="text-center mt-4">
            <p className="text-slate-400 text-xs">
              Live streams provided by YouTube ✶ Attribution and monetization remains with content owners
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            📺 Live Channels
          </h1>
          <p className="text-slate-400">Choose a channel to start watching live coverage</p>
        </div>

        {/* Channel Catalogue */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className="group relative w-full glass-panel rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
              style={{aspectRatio: '16/9'}}
            >
              <img
                src={channel.thumbnail}
                alt={channel.name}
                className="w-full h-full object-contain bg-white/5"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `
                    <div class="absolute inset-0 bg-red-600 flex items-center justify-center">
                      <span class="text-white font-bold text-4xl">${channel.name.charAt(0)}</span>
                    </div>
                  `;
                }}
              />

              {/* Live indicator overlay */}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 rounded-full px-2 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-white">LIVE</span>
              </div>

              {/* Channel name overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <h3 className="text-white font-semibold text-sm text-center group-hover:text-accent-400 transition-colors">
                  {channel.name}
                </h3>
              </div>
            </button>
          ))}
        </div>

        {/* Info Section */}
        <div className="text-center mt-12">
          <div className="glass-panel rounded-xl p-4 max-w-lg mx-auto">
            <p className="text-slate-300 text-sm">
              <span className="text-accent-500">🔴 Live</span> streams update in real-time with breaking news coverage from major networks
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveView;
