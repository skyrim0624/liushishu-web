import { avatarInitial } from "../../services/avatar";

interface AvatarProps {
  avatarUrl: string;
  displayName: string;
  email: string;
  size: "header" | "profile";
}

export function Avatar({ avatarUrl, displayName, email, size }: AvatarProps) {
  return (
    <span className={`avatar-frame avatar-frame-${size}`}>
      {avatarUrl ? <img alt="" className="avatar-img" src={avatarUrl} /> : null}
      <span className={`avatar-fallback ${avatarUrl ? "hidden" : ""}`}>
        {avatarInitial(displayName, email)}
      </span>
    </span>
  );
}
