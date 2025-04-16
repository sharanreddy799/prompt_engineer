import { useEffect } from "react";

const GroqClient = ({ latex, jobDescription, setResponse, setLoading }) => {
  useEffect(() => {
    const callGroqAPI = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/groq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latex, jobDescription }),
        });

        if (!res.body) {
          throw new Error("ReadableStream not supported in response.");
        }

        const reader = res.body.getReader();
        const chunks = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        const fullBuffer = new Uint8Array(
          chunks.reduce((acc, val) => acc + val.length, 0)
        );
        let offset = 0;
        for (const chunk of chunks) {
          fullBuffer.set(chunk, offset);
          offset += chunk.length;
        }

        const rawResult = new TextDecoder("utf-8").decode(fullBuffer);

        const cleanResult = rawResult.replace(
          /<think>[\s\S]*?<\/think>/gi,
          (match) => {
            console.log("Filtered Explanation:", match);
            return "";
          }
        );

        setResponse(cleanResult);
        setLoading(false);
      } catch (err) {
        setResponse("Error: " + err.message);
        setLoading(false);
      }
    };

    callGroqAPI();
  }, [latex, jobDescription, setResponse, setLoading]);

  return null;
};

export default GroqClient;
