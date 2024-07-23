"use client";

import clsx from "clsx";
import { useState, useRef, useEffect } from "react";
import { EnterIcon, LoadingIcon } from "@/app/lib/icons";
import { toast } from "sonner";

type Message = {
	role: "user" | "assistant";
	content: string;
	latency?: number;
};

export default function Home() {
	const [input, setInput] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [isPending, setIsPending] = useState(false);
	
	useEffect(() => {
		function keyDown(e: KeyboardEvent) {
			if (e.key === "Enter") return inputRef.current?.focus();
			if (e.key === "Escape") return setInput("");
		}

		window.addEventListener("keydown", keyDown);
		return () => window.removeEventListener("keydown", keyDown);
	}, []);

	const submit = async (data: string | Blob) => {
		const formData = new FormData();
		if (typeof data === "string") {
			formData.append("input", data);
		} else {
			formData.append("input", data, "audio.wav");
		}

		for (const message of messages) {
			formData.append("message", JSON.stringify(message));
		}

		setIsPending(true);
		const submittedAt = Date.now();

		try {
			const response = await fetch("/api", {
				method: "POST",
				body: formData,
			});

			const responseData = await response.json();

			if (!response.ok || !responseData.text) {
				if (response.status === 429) {
					toast.error("Too many requests. Please try again later.");
				} else {
					toast.error(responseData.error || "An error occurred.");
				}

				setIsPending(false);
				return;
			}

			const latency = Date.now() - submittedAt;

			setInput(""); // Clear input field

			setMessages((prevMessages) => [
				...prevMessages,
				{
					role: "user",
					content: data instanceof Blob ? "Audio input received" : data,
				},
				{
					role: "assistant",
					content: responseData.text,
					latency,
				},
			]);
		} catch (error) {
			console.error("Error submitting data:", error);
			toast.error("An error occurred while submitting your request.");
		} finally {
			setIsPending(false);
		}
	};

	function handleFormSubmit(e: React.FormEvent) {
		e.preventDefault();
		submit(input);
	}

	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-2 grow">
			<h1 className="text-5xl text-gray-400">ECHO</h1>

			<form
				className="rounded-full bg-neutral-200/80 dark:bg-neutral-800/80 flex items-center w-full max-w-3xl border border-transparent hover:border-neutral-300 focus-within:border-neutral-400 hover:focus-within:border-neutral-400 dark:hover:border-neutral-700 dark:focus-within:border-neutral-600 dark:hover:focus-within:border-neutral-600"
				onSubmit={handleFormSubmit}
			>
				<input
					type="text"
					className="bg-transparent focus:outline-none p-4 w-full placeholder:text-neutral-600 dark:placeholder:text-neutral-400 text-white"
					required
					placeholder="Ask me anything"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					ref={inputRef}
				/>

				<button
					type="submit"
					className="p-4 text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white"
					disabled={isPending}
					aria-label="Submit"
				>
					{isPending ? <LoadingIcon /> : <EnterIcon />}
				</button>
			</form>

			<div className="text-neutral-400 dark:text-neutral-600 pt-4 text-center max-w-xl text-balance min-h-28 space-y-4">
				{messages.length > 0 ? (
					<p>
						{messages.at(-1)?.content}
						<span className="text-xs font-mono text-neutral-300 dark:text-neutral-700">
							{" "}
							({messages.at(-1)?.latency}ms)
						</span>
					</p>
				) : (
					<p>
						A fast AI assistant with voice recognition and text-to-speech
					</p>
				)}
			</div>
		</main>
	);
}
