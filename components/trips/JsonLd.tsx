export default function JsonLd({ data }: { data: object }) {
  // 콘텐츠는 저장소 JSON이지만 </script> 조기 종료를 막으려 '<'를 이스케이프한다.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
