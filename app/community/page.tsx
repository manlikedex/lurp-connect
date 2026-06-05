"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Heart,
  MessageCircle,
  MessageSquare,
  Plus,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/lib/supabase";
import { awardXp } from "@/lib/xp";
import { createNotification } from "@/lib/notifications";

type ProfileSummary = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Post = {
  id: string;
  author_id: string;
  title: string;
  content: string | null;
  category: string | null;
  image_url: string | null;
  created_at: string;
  profiles: ProfileSummary | null;
};

type RawPost = Omit<Post, "profiles"> & {
  profiles: ProfileSummary | ProfileSummary[] | null;
};

type Like = {
  post_id: string;
};

type Comment = {
  post_id: string;
};

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, number>>({});
  const [myLikes, setMyLikes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select(
        `
        id,
        author_id,
        title,
        content,
        category,
        image_url,
        created_at,
        profiles:author_id (
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (postError) {
      console.error("Post load error:", postError);
      setLoading(false);
      return;
    }

    const loadedPosts: Post[] = ((postData || []) as RawPost[]).map((post) => ({
      ...post,
      profiles: Array.isArray(post.profiles)
        ? post.profiles[0] || null
        : post.profiles,
    }));

    setPosts(loadedPosts);

    const postIds = loadedPosts.map((post) => post.id);

    if (postIds.length > 0) {
      const { data: likeData, error: likeError } = await supabase
        .from("post_likes")
        .select("post_id")
        .in("post_id", postIds);

      if (likeError) {
        console.error("Like count error:", likeError);
      }

      const likeCounts: Record<string, number> = {};

      likeData?.forEach((like: Like) => {
        likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1;
      });

      setLikes(likeCounts);

      const { data: commentData, error: commentError } = await supabase
        .from("post_comments")
        .select("post_id")
        .in("post_id", postIds);

      if (commentError) {
        console.error("Comment count error:", commentError);
      }

      const commentCounts: Record<string, number> = {};

      commentData?.forEach((comment: Comment) => {
        commentCounts[comment.post_id] =
          (commentCounts[comment.post_id] || 0) + 1;
      });

      setComments(commentCounts);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: myLikeData, error: myLikeError } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("profile_id", user.id)
          .in("post_id", postIds);

        if (myLikeError) {
          console.error("My likes error:", myLikeError);
        }

        const likedMap: Record<string, boolean> = {};

        myLikeData?.forEach((like: Like) => {
          likedMap[like.post_id] = true;
        });

        setMyLikes(likedMap);
      }
    } else {
      setLikes({});
      setComments({});
      setMyLikes({});
    }

    setLoading(false);
  }

  async function toggleLike(postId: string) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("User error:", userError);
      alert(userError.message);
      return;
    }

    if (!user) {
      alert("Login with Discord to like posts.");
      return;
    }

    const currentlyLiked = myLikes[postId];

    if (currentlyLiked) {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("profile_id", user.id);

      if (error) {
        console.error("Unlike error:", error);
        alert(error.message);
        return;
      }

      setMyLikes((current) => ({
        ...current,
        [postId]: false,
      }));

      setLikes((current) => ({
        ...current,
        [postId]: Math.max((current[postId] || 1) - 1, 0),
      }));

      return;
    }

    const { error } = await supabase.from("post_likes").insert({
      post_id: postId,
      profile_id: user.id,
    });

    if (error) {
      console.error("Like error:", error);
      alert(error.message);
      return;
    }

    const likedPost = posts.find((post) => post.id === postId);

    if (likedPost && likedPost.author_id !== user.id) {
      await awardXp(likedPost.author_id, "like_received");
    }

    if (likedPost && likedPost.author_id !== user.id) {
  await createNotification({
    profileId: likedPost.author_id,
    title: "Post liked",
    message: "Someone liked your community post.",
  });
}

    setMyLikes((current) => ({
      ...current,
      [postId]: true,
    }));

    setLikes((current) => ({
      ...current,
      [postId]: (current[postId] || 0) + 1,
    }));
  }

  return (
    <AppShell>
      <PageHeader
        badge="Community Feed"
        title="What's happening in LURP."
        description="Community posts, screenshots, announcements, business adverts and player updates."
        icon={MessageCircle}
      />

      <div className="mt-5 flex justify-end">
        <Link
          href="/community/create"
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#111118] transition hover:scale-[1.02]"
        >
          <Plus size={17} />
          Create Post
        </Link>
      </div>

      {loading && (
        <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#111118] p-8">
          <p className="text-white/55">Loading community posts...</p>
        </section>
      )}

      {!loading && posts.length === 0 && (
        <section className="mt-5 flex min-h-[360px] flex-col items-center justify-center rounded-[2.2rem] border border-white/10 bg-[#111118] p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
            <MessageCircle size={38} />
          </div>

          <h2 className="mt-6 text-3xl font-black">No community posts yet.</h2>

          <p className="mt-3 max-w-md text-sm leading-6 text-white/55">
            Be the first to share an update, screenshot, story or announcement
            with LURP.
          </p>
        </section>
      )}

      {!loading && posts.length > 0 && (
        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            {posts.map((post) => (
              <article
                key={post.id}
                className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111118]"
              >
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
                    <p className="font-black">
                      {post.profiles?.display_name ||
                        post.profiles?.username ||
                        "LURP Member"}
                    </p>
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
                  <h2 className="text-2xl font-black">{post.title}</h2>

                  {post.content && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/60">
                      {post.content}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => toggleLike(post.id)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
                        myLikes[post.id]
                          ? "border-purple-300/25 bg-purple-300/10 text-purple-100"
                          : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.07]"
                      }`}
                    >
                      <Heart
                        size={16}
                        className={myLikes[post.id] ? "fill-current" : ""}
                      />
                      {likes[post.id] || 0} Likes
                    </button>

                    <Link
                      href={`/community/${post.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/60 transition hover:bg-white/[0.07]"
                    >
                      <MessageSquare size={16} />
                      {comments[post.id] || 0} Comments
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="hidden space-y-5 xl:block">
            <div className="rounded-[2rem] border border-white/10 bg-[#111118] p-5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200 ring-1 ring-purple-300/15">
                <Camera size={22} />
              </div>

              <h2 className="text-xl font-black">Share RP Moments</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">
                Post screenshots, event media, character updates and business
                adverts to keep the community active.
              </p>
            </div>
          </aside>
        </section>
      )}
    </AppShell>
  );
}