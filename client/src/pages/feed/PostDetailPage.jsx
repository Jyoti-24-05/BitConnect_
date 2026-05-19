// client/src/pages/feed/PostDetailPage.jsx
import { useParams } from "react-router-dom";
const PostDetailPage = () => {
  const { postId } = useParams();
  return <div className="bg-white rounded-2xl p-6">Post {postId} — coming next</div>;
};
export default PostDetailPage;