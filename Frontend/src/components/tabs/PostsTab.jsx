import React, { useEffect, useRef, useState } from 'react';
import { Image, MoreHorizontal, Send, Trash2, Users, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPosts, createPost, deletePost } from '../../api';
import styles from './PostsTab.module.css';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export default function PostsTab() {
  const { loggedInUser, triggerAlert } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [media, setMedia] = useState(null);
  const fileInputRef = useRef(null);

  const loadPosts = () => {
    setLoading(true);
    getPosts().then(setPosts).catch(() => triggerAlert('error', 'Không thể tải bảng tin.')).finally(() => setLoading(false));
  };

  useEffect(() => { loadPosts(); }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if ((!content.trim() && !media) || posting) return;
    setPosting(true);
    try {
      const post = await createPost(content, media?.data, media?.type);
      setPosts(prev => [post, ...prev]);
      setContent('');
      setMedia(null);
      triggerAlert('success', 'Đã đăng bài.');
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const detail = validationErrors
        ? Object.values(validationErrors).flat().join(' ')
        : null;
      triggerAlert('error', error.response?.data?.message || detail || 'Không thể đăng bài.');
    } finally {
      setPosting(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
    if (!type) {
      triggerAlert('error', 'Chỉ được chọn ảnh hoặc video.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      triggerAlert('error', 'Ảnh/video không được vượt quá 10 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setMedia({ data: reader.result, type, name: file.name, preview: URL.createObjectURL(file) });
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id) => {
    try {
      await deletePost(id);
      setPosts(prev => prev.filter(post => post.id !== id));
    } catch (error) {
      triggerAlert('error', error.response?.data?.message || 'Không thể xóa bài viết.');
    }
  };

  return (
    <main className={cx('posts-tab')}>
      <header className={cx('posts-tab__header')}>
        <div>
          <span className={cx('posts-tab__eyebrow')}><Users size={14} /> Cộng đồng</span>
          <h1>Bảng tin</h1>
          <p>Chia sẻ điều bạn đang nghĩ cùng bạn bè.</p>
        </div>
        <button className={cx('posts-tab__refresh')} onClick={loadPosts} title="Làm mới bảng tin"><MoreHorizontal size={20} /></button>
      </header>

      <form className={cx('posts-tab__composer')} onSubmit={handleSubmit}>
        <img src={loggedInUser?.profilePhoto || 'https://via.placeholder.com/48'} alt="" />
        <div className={cx('posts-tab__composer-body')}>
          <textarea value={content} onChange={event => setContent(event.target.value)} maxLength={2000} placeholder="Bạn đang nghĩ gì?" rows={3} />
          <div className={cx('posts-tab__composer-footer')}>
            <span><button type="button" className={cx('posts-tab__media-button')} onClick={() => fileInputRef.current?.click()}><Image size={17} /> Chọn ảnh/video</button><input ref={fileInputRef} type="file" accept="image/*,video/*" hidden onChange={handleFileChange} /></span>
            <div><small>{content.length}/2000</small><button disabled={posting || (!content.trim() && !media)}><Send size={16} /> {posting ? 'Đang đăng...' : 'Đăng bài'}</button></div>
          </div>
          {media && <div className={cx('posts-tab__media-preview')}><button type="button" onClick={() => setMedia(null)} title="Bỏ file"><X size={16} /></button>{media.type === 'image' ? <img src={media.preview} alt="Xem trước" /> : <video src={media.preview} controls />}</div>}
        </div>
      </form>

      <section className={cx('posts-tab__feed')}>
        {loading ? <div className={cx('posts-tab__empty')}>Đang tải bảng tin...</div> : posts.length === 0 ? <div className={cx('posts-tab__empty')}>Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ.</div> : posts.map(post => (
          <article className={cx('post-card')} key={post.id}>
            <div className={cx('post-card__top')}>
              <img src={post.profilePhoto || 'https://via.placeholder.com/44'} alt="" />
              <div><strong>{post.authorName || post.username}</strong><time>{new Date(post.createdAt).toLocaleString()}</time></div>
              {post.userId === loggedInUser?.id && <button onClick={() => handleDelete(post.id)} title="Xóa bài viết"><Trash2 size={17} /></button>}
            </div>
            {post.content && <p className={cx('post-card__content')}>{post.content}</p>}
            {post.mediaUrl && (post.mediaType === 'video' ? <video className={cx('post-card__media')} src={post.mediaUrl} controls /> : <img className={cx('post-card__media')} src={post.mediaUrl} alt="Nội dung bài viết" />)}
            <div className={cx('post-card__actions')}><span>Bài viết trong vòng bạn bè</span></div>
          </article>
        ))}
      </section>
    </main>
  );
}