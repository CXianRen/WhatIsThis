import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";

export default function YouglishWidget({ word, lang = "english", width = 640, height = 550, onStatus }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const timerRef = useRef(null);
  const initializedRef = useRef(false);
  const lastWordRef = useRef({ word: null, lang: null });

  const containerId = "youglish-widget-container"; // ⚠️ 固定 id
  const [status, setStatus] = useState("加载中...");
  const [widgetReady, setWidgetReady] = useState(false);

  // 动态加载 Youglish 脚本
  useEffect(() => {
    const loadScript = () => {
      const script = document.createElement("script");
      script.src = "https://youglish.com/public/emb/widget.js";
      script.async = true;

      script.onload = () => {
        window.onYouglishAPIReady = () => {
          const msg = "YouGlish API 已就绪";
          setStatus(msg);
          onStatus?.(msg);
          initWidget();
        };
      };

      script.onerror = () => {
        const msg = "脚本加载失败";
        setStatus(msg);
        onStatus?.(msg);
      };

      document.head.appendChild(script);
      return script;
    };

    // 如果 YG 已存在，直接初始化
    if (window.YG) {
      initWidget();
      return;
    }

    const script = loadScript();

    return () => {
      pauseWidget();
      if (script) document.head.removeChild(script);
    };
  }, []);

  // 初始化 Widget，只执行一次
  const initWidget = () => {
    if (initializedRef.current) return;
    if (!window.YG || !containerRef.current || widgetRef.current) return;

    initializedRef.current = true;

    try {
      // ⚠️ 传 containerId 而不是 DOM
      widgetRef.current = new window.YG.Widget(containerId, {
        width,
        height,
        components: 88,
        autoStart: 0,
        events: {
          onFetchDone: (e) => {
            const msg = e.totalResult === 0 ? "没有找到结果" : `找到 ${e.totalResult} 个发音示例`;
            setStatus(msg);
            onStatus?.(msg);
          },
          onCaptionConsumed: () => {
            pauseWidget();
            timerRef.current = setTimeout(() => {
              if (widgetRef.current) widgetRef.current.replay();
            }, 2000);
          },
          onVideoReady: () => {
            const msg = "播放器已准备就绪";
            setStatus(msg);
            onStatus?.(msg);
            // setWidgetReady(true);
          },
          onError: (e) => {
            const msg = "发生错误：" + e.code;
            setStatus(msg);
            onStatus?.(msg);
          },
        },
      });
      
      setWidgetReady(true);
      const msg = "Widget 已创建";
      setStatus(msg);
      onStatus?.(msg);
    } catch (e) {
      const msg = "Widget 创建失败: " + e.message;
      console.error(msg);
      setStatus(msg);
      onStatus?.(msg);
    }
  };

  // 每次 word/lang 改变时调用 fetch
  useEffect(() => {
    if (!widgetReady || !widgetRef.current || !word || !containerRef.current) return;

    if (lastWordRef.current.word === word && lastWordRef.current.lang === lang) return;

    lastWordRef.current = { word, lang };

    const msg = "正在搜索: " + word;
    setStatus(msg);
    onStatus?.(msg);

    try {
      widgetRef.current.fetch(word, lang);
    } catch (e) {
      const err = "搜索失败: " + e.message;
      console.error(err);
      setStatus(err);
      onStatus?.(err);
    }
  }, [word, lang, widgetReady]);

  // 暂停 widget 并清理定时器
  const pauseWidget = () => {
    if (widgetRef.current) {
      try {
        widgetRef.current.pause();
      } catch {}
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <Box>
      <Box
        id={containerId} // ⚠️ 必须有 id
        ref={containerRef}
        sx={{
          width,
          height,
          border: "1px solid #ccc",
          borderRadius: 1,
          overflow: "hidden",
          mb: 1,
        }}
      >
        {!widgetReady && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              background: "#f0f0f0",
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Box>
      <Typography variant="body2" color="text.secondary">
        {status}
      </Typography>
    </Box>
  );
}
