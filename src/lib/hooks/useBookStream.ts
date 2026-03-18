import { useState, useRef, useCallback } from "react";

interface UseBookStreamProps {
    onSuccess?: () => void;
    onError?: (err: Error) => void;
}

export function useBookStream({ onSuccess, onError }: UseBookStreamProps = {}) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    const startStream = useCallback(
        async (payload: {
            prompt: string;
            previousContent: string;
            bookContext: string;
            workspaceId: string;
            instruction?: string;
            language?: string;
        }, onChunk: (text: string) => void) => {
            setIsGenerating(true);
            setError(null);

            // Cancel previous request if any
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();

            try {
                const res = await fetch("/api/generate/book-stream", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                    signal: abortControllerRef.current.signal,
                    credentials: "include",
                });

                if (!res.ok) {
                    let errMsg = "Failed generating stream";
                    try {
                        const data = await res.json();
                        errMsg = data.error || errMsg;
                    } catch { }
                    throw new Error(errMsg);
                }

                if (!res.body) throw new Error("No response body");

                const reader = res.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let done = false;

                while (!done) {
                    const { value, done: streamDone } = await reader.read();
                    done = streamDone;

                    if (value) {
                        const chunk = decoder.decode(value, { stream: true });

                        // Handle SSE format "data: {...}\n\n"
                        const lines = chunk.split("\n");
                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                const dataStr = line.replace("data: ", "").trim();
                                if (dataStr === "[DONE]") {
                                    done = true;
                                    break;
                                }
                                if (dataStr) {
                                    try {
                                        const parsed = JSON.parse(dataStr);
                                        if (parsed.text) {
                                            onChunk(parsed.text);
                                        }
                                    } catch (e) {
                                        // Could be partial chunk
                                    }
                                }
                            }
                        }
                    }
                }

                if (onSuccess) onSuccess();
            } catch (err: any) {
                if (err.name === "AbortError") {
                    console.log("Stream aborted");
                } else {
                    setError(err.message || "Something went wrong.");
                    if (onError) onError(err);
                }
            } finally {
                setIsGenerating(false);
                abortControllerRef.current = null;
            }
        },
        [onSuccess, onError]
    );

    const stopStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    return { startStream, stopStream, isGenerating, error };
}
