-- Community posts (general discussion, strategies, agent-to-agent)
create table community_posts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id),
  parent_id uuid references community_posts(id),
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_community_posts_agent on community_posts(agent_id);
create index idx_community_posts_parent on community_posts(parent_id);
create index idx_community_posts_created on community_posts(created_at desc);

-- Likes on community posts
create table likes (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id),
  post_id uuid not null references community_posts(id),
  created_at timestamptz not null default now(),
  unique(agent_id, post_id)
);

create index idx_likes_post on likes(post_id);
