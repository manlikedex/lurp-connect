"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, MessageSquare, Send, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/lib/supabase";
import { awardXp } from "@/lib/xp";

type Post = {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  category: string | null;
  created_at: string;
  profiles:
    | {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
      }
    | null;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  profiles:
    | {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
      }
    | null;
};

export default function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [id]);

  async function loadPost() {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        id,
        title,
        content,
        image_url,
        category,
        created_at,
        profiles:author_id (
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Post load error:", error);
    }

    const formattedPost = data
  ? {
      ...data,
      profiles: Array.isArray(data.profiles)
        ? data.profiles[0] || null
        : data.profiles,
    }
  : null;

setPost(formattedPost as Post | null);
    setLoading(false);
  }

  async function loadComments() {
    const { data, error } = await supabase
      .from("post_comments")
      .select(
        `
        id,
        content,
        created_at,
        profiles:profile_id (
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq("post_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Comment load error:", error);
    }

    const formattedComments =
  data?.map((comment) => ({
    ...comment,
    profiles: Array.isArray(comment.profiles)
      ? comment.profiles[0] || null
      : comment.profiles,
  })) || [];

setComments(formattedComments as Comment[]);
  }

  async function submitComment() {
    if (!comment.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Login required.");
      return;
    }

    const { error } = await supabase.from("post_comments").insert({
      post_id: id,
      profile_id: user.id,
      content: comment,
    });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await awardXp(user.id, "comment");

    setComment("");
    loadComments();
  }

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-8">
          Loading...
        </div>
      </AppShell>
    );
  }

  if (!post) {
    return (
      <AppShell>
        <Link
          href="/community"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Feed
        </Link>

        <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-8">
          <h1 className="text-3xl font-black">Post not found.</h1>
          <p className="mt-2 text-white/50">
            This usually means the URL does not contain a valid post ID.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link
        href="/community"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to Feed
      </Link>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111118]">
        <div className="flex items-center gap-3 p-5">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
            {post.profiles?.avatar_url ? (
              <img
                src={post.profiles.avatar_url}
                alt={post.profiles.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound size={22} />
            )}
          </div>

          <div>
            <h2 className="font-black">
              {post.profiles?.display_name ||
                post.profiles?.username ||
                "LURP Member"}
            </h2>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-200/70">
              {post.category || "community"}
            </p>
          </div>
        </div>

        {post.image_url && (
          <div className="max-h-[520px] overflow-hidden border-y border-white/10">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full object-cover"
            />
          </div>
        )}

        <div className="p-5">
          <h1 className="text-3xl font-black">{post.title}</h1>

          {post.content && (
            <p className="mt-4 whitespace-pre-wrap leading-7 text-white/65">
              {post.content}
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/60">
              <Heart size={16} />
              Like
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/60">
              <MessageSquare size={16} />
              {comments.length} Comments
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#111118] p-6">
        <h2 className="text-xl font-black">Comments</h2>

        <div className="mt-5 flex gap-3">
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            placeholder="Write a comment..."
            className="flex-1 resize-none rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-white outline-none placeholder:text-white/30"
          />

          <button
            onClick={submitComment}
            className="h-fit rounded-full bg-white px-5 py-3 font-black text-[#111118]"
          >
            <Send size={16} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-white/45">No comments yet.</p>
          )}

          {comments.map((item) => (
            <article
              key={item.id}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4"
            >
              <p className="font-black">
                {item.profiles?.display_name ||
                  item.profiles?.username ||
                  "LURP Member"}
              </p>

              <p className="mt-2 text-white/70">{item.content}</p>

              <p className="mt-3 text-xs text-white/35">
                {new Date(item.created_at).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}