import React from 'react';

const PostViewer = ({ post }) => {
  if (!post) {
    return <div className="error">Post not found</div>;
  }

  return (
    <div className="post-viewer">
      <h2 style={{ fontSize: '14px', marginBottom: '8px' }}>{post.title}</h2>
      <div className="post-meta" style={{ marginBottom: '16px', fontSize: '11px', color: '#666' }}>
        Posted by {post.author} on {new Date(post.createdAt).toLocaleString()}
      </div>
      <div className="post-content" style={{ fontSize: '12px', lineHeight: '1.5' }}>
        {post.content}
      </div>
    </div>
  );
};

export default PostViewer;