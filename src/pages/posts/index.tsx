import { GetStaticProps } from 'next';
import Head from 'next/head';
import { createClient } from '../../../prismicio';
import { RichText } from 'prismic-dom';

import styles from './styles.module.scss';
import Link from 'next/link';

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  updatedAt: string;
};

interface PostsProps {
  posts: Post[];
}

export default function Posts({ posts }: PostsProps) {
  return (
    <>
      <Head>
        <title>Posts ! Ignews</title>
      </Head>
      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map((post) => (
            <Link href={`/posts/${post.slug}`} legacyBehavior>
              <a key={post.slug}>
                <time>{post.updatedAt}</time>
                <strong>{post.title}</strong>
                <p>{post.excerpt}</p>
              </a>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = createClient();

  const response = await prismic.getAllByType('post', {
    fetch: ['post.title', 'post.content'],
    pageSize: 10,
  });

  // RESOLVER LOGICA PARA PUXAR APENAS O PRIMEIRO PARAGRAFO **********

  const posts = response.map((post) => {
    return {
      slug: post.uid,
      title: RichText.asText(post.data.title),
      // Retornando resumo do texto do conteudo
      excerpt: post.data.content.map((content) => {
        const text = content.text;

        const breakText = text.split('\n');

        return breakText[2];
      }),

      // excerpt:
      //   post.data.content.find((content) => content.type === 'paragraph')
      //     ?.text ?? '',

      updatedAt: new Date(post.last_publication_date).toLocaleDateString(
        'pt-BR',
        {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }
      ),
    };
  });

  // console.log(JSON.stringify(posts, null, 2));

  return {
    props: {
      posts,
    },
  };
};
