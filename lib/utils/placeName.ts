interface NamedPlace {
  name: string;
  nameKo?: string | null;
  country?: string | null;
}

/** 화면 제목. 한국어 이름이 없으면 원문이다. */
export function displayName(place: NamedPlace): string {
  return place.nameKo?.trim() || place.name;
}

/** 한국어 이름을 제목으로 쓸 때 보조줄에 둘 원문. 같으면 null이다. */
export function originalName(place: NamedPlace): string | null {
  const ko = place.nameKo?.trim();
  return ko && ko !== place.name ? place.name : null;
}

const ORIGINAL_NAME_LANG: Record<string, string> = { JP: 'ja', CN: 'zh-Hans', TW: 'zh-Hant', VN: 'vi' };

/** 원문 보조줄의 lang. 같은 한자도 일본어·중국어 글꼴이 달라 글리프가 맞게 그려지고 스크린리더가 현지어로 읽는다. */
export function originalNameLang(place: NamedPlace): string | undefined {
  return place.country ? ORIGINAL_NAME_LANG[place.country] : undefined;
}
