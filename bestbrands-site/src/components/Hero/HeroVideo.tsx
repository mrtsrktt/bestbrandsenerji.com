import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './HeroVideo.module.css';
import { siteConfig } from '../../config/siteConfig';

interface HeroVideoProps {
  readyToPlay?: boolean;
}

export const HeroVideo: React.FC<HeroVideoProps> = ({ readyToPlay = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });
  const [hasError, setHasError] = useState<boolean>(false);

  // Sayfa açılışında / reveal anında autoplay ve prefers-reduced-motion yönetimi
  useEffect(() => {
    if (!readyToPlay) return;

    const video = videoRef.current;
    if (!video) return;

    const startPlayback = async () => {
      try {
        await video.play();
        setIsPlaying(true);
        setIsAutoplayBlocked(false);
      } catch (err) {
        // Tarayıcı autoplay ilkesi gereği otomatik oynatma engellenmişse
        console.warn('Autoplay tarayıcı tarafından engellendi veya kullanıcı etkileşimi bekleniyor:', err);
        setIsAutoplayBlocked(true);
        setIsPlaying(false);
      }
    };

    startPlayback();
  }, [readyToPlay]);

  // Oynatma / Duraklatma geçişi
  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video.play().then(() => {
        setIsPlaying(true);
        setIsEnded(false);
        setIsAutoplayBlocked(false);
      }).catch((err) => {
        console.error('Video başlatılamadı:', err);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Video bittiğinde son karede kalır, tekrar izle butonu belirir
  const handleVideoEnded = useCallback(() => {
    setIsEnded(true);
    setIsPlaying(false);
  }, []);

  // Tekrar izle butonu tıklandığında başa sarıp tekrar oynatır
  const handleReplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.play().then(() => {
      setIsEnded(false);
      setIsPlaying(true);
      setIsAutoplayBlocked(false);
    }).catch((err) => {
      console.error('Video yeniden oynatılamadı:', err);
    });
  }, []);

  // Video hata yönetimi
  const handleVideoError = useCallback(() => {
    console.error('Hero videosu yüklenemedi. Poster görseli gösteriliyor.');
    setHasError(true);
    setIsAutoplayBlocked(false);
    setIsPlaying(false);
  }, []);

  return (
    <section className={styles.heroSection} aria-label="Tanıtım Filmi ve Giriş Alanı">
      <div className={styles.videoContainer}>
        {/* Hata durumunda veya video yüklenirken fallback poster */}
        {hasError && (
          <img
            src={siteConfig.hero.posterSrc}
            alt={siteConfig.hero.accessibleTitle}
            className={styles.posterImage}
          />
        )}

        <video
          ref={videoRef}
          src={siteConfig.hero.videoSrc}
          poster={siteConfig.hero.posterSrc}
          className={styles.videoElement}
          muted={siteConfig.hero.playbackSettings.muted}
          playsInline={siteConfig.hero.playbackSettings.playsInline}
          loop={siteConfig.hero.playbackSettings.loop}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Üst ve Alt Gradyan Katmanları - Header ve Tipografi Okunurluğu */}
        <div className={styles.overlayScrim} aria-hidden="true" />
        <div className={styles.bottomScrim} aria-hidden="true" />
      </div>

      {/* Editoryal Sol Alt Tipografi Bloğu (Stellar Management 1:1 Eşleşme) */}
      <div className={`${styles.heroEditorial} ${readyToPlay ? styles.isRevealed : ''}`}>
        <h1 className={styles.heroTitle} aria-label="Türkiye’nin büyüyen sürdürülebilir gücü">
          <span className={styles.heroTitleLineWrap}>
            <span className={styles.heroTitleLine}>Türkiye’nin</span>
          </span>
          <span className={styles.heroTitleLineWrap}>
            <span className={styles.heroTitleLine}>büyüyen</span>
          </span>
          <span className={styles.heroTitleLineWrap}>
            <span className={styles.heroTitleLine}>
              sürdürülebilir <i className={styles.heroTitleItalic}>gücü</i>
            </span>
          </span>
        </h1>
        <p className={styles.heroDescription}>
          Güneş santrallerinden araç muayene altyapısına, güvenle büyüyen entegre portföy.
        </p>
      </div>

      {/* Autoplay Engellendiğinde Merkezde ~64px Dairesel Oynatma Kontrolü ve Alt Metin */}
      {isAutoplayBlocked && !isEnded && !hasError && (
        <div className={styles.manualPlayCenter}>
          <button
            type="button"
            className={styles.circularPlayButton}
            onClick={handleTogglePlay}
            aria-label="Tanıtım filmini oynat"
          >
            <svg
              className={styles.circularPlayIcon}
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
              aria-hidden="true"
            >
              <polygon points="8 5 19 12 8 19 8 5"></polygon>
            </svg>
          </button>
          <span className={styles.circularPlayLabel}>Filmi oynat</span>
        </div>
      )}

      {/* Sol Alt Duraklat / Devam Kontrolü (Sade Görsel Aile, Video Bitince Gizlenir) */}
      {!hasError && !isAutoplayBlocked && !isEnded && (
        <div className={styles.playbackControls}>
          <button
            type="button"
            className={styles.controlButton}
            onClick={handleTogglePlay}
            aria-label={isPlaying ? 'Videoyu duraklat' : 'Videoyu devam ettir'}
            title={isPlaying ? 'Durdur' : 'Oynat'}
          >
            {isPlaying ? (
              <>
                <svg className={styles.controlIcon} viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
                <span>Durdur</span>
              </>
            ) : (
              <>
                <svg className={styles.controlIcon} viewBox="0 0 24 24" aria-hidden="true">
                  <polygon points="6 4 20 12 6 20 6 4"></polygon>
                </svg>
                <span>Oynat</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Video Bitince Beliren Sade "Tekrar İzle" Butonu */}
      {isEnded && !hasError && (
        <div className={styles.replayButtonWrap}>
          <button
            type="button"
            className={styles.replayButton}
            onClick={handleReplay}
            aria-label="Videoyu baştan tekrar izle"
          >
            <svg
              className={styles.replayIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            <span>Tekrar İzle</span>
          </button>
        </div>
      )}

      {/* Video Hata Bildirimi */}
      {hasError && (
        <div className={styles.errorStateMessage} role="alert">
          Video akışı şu anda görüntülenemiyor. Poster görseli görüntülenmektedir.
        </div>
      )}
    </section>
  );
};
