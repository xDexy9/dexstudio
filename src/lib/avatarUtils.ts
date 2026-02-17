const emailToAvatar: Record<string, string> = {
  'paul@garage.com': '/avatars/AvatarPaul.png',
  'cindy@garage.com': '/avatars/AvatarCindy.png',
  'ambre@garage.com': '/avatars/AvatarAmbre.png',
  'lucas@garage.com': '/avatars/AvatarLucas.png',
  'lilian@garage.com': '/avatars/AvatarLilian.png',
  'nichita@garage.com': '/avatars/AvatarNichita.png',
  'sergio@garage.com': '/avatars/AvatarSergio.png',
  'auto.express.corse@gmail.com': '/avatars/AvatarAdrian.png',
};

export const getUserAvatarUrl = (email: string): string | undefined => {
  return emailToAvatar[email.toLowerCase()];
};
