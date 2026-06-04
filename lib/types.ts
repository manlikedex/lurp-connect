export type CharacterVisibility = "public" | "private";

export type Character = {
  id: string;
  owner_id: string;
  name: string;
  age: string;
  occupation: string;
  faction: string;
  short_bio: string;
  backstory: string;
  image_url: string | null;
  visibility: CharacterVisibility;
  created_at: string;
};