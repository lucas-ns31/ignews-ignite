import React from 'react';
import { GetStaticProps } from 'next';

import Head from 'next/head';

import { SubscribeButton } from '../components/SubscribeButton';

import styles from './home.module.scss';
import { stripe } from '../services/stripe';

interface HomeProps {
  product: {
    priceId: string;
    amount: number;
  };
}

// Next, 3 formas de fazer uma chamada API

// Client side - browser
// Server-side - sever node
// Static generation - server node - salva um HTML

export default function Home({ product }: HomeProps) {
  return (
    <>
      <Head>
        <title>Home | ig.news</title>
      </Head>
      <main className={styles.contentContainer}>
        <section className={styles.hero}>
          <span>👏🏻 Hey, welcome</span>
          <h1>
            News about the <span>React</span> world.
          </h1>
          <p>
            Get access to all publications <br />
            <span>for {product.amount} month</span>
          </p>
          <SubscribeButton priceId={product.priceId} />
        </section>

        <img src="/images/avatar.svg" alt="Girl coding" />
      </main>
    </>
  );
}

// Função server side rendering de conexão com api de pagamentos
// SSR - server side rendering -> getServerSideProps
/* SSG - server static generation: 
  getStaticProps -> executa uma vez e salva um HTML estatico que sera
  usado nas proximas requisições;
  Somente sera gerado um novo HTML apos exceder o tempo do revalidate

*/

export const getStaticProps: GetStaticProps = async () => {
  // buscando informação de preço da api do stripe
  const price = await stripe.prices.retrieve('price_1N8WJkGOpDEJfbtJXhVIywN9');

  const product = {
    priceId: price.id,
    amount: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price.unit_amount / 100), //preço requisitado retorna sempre em centavos
  };

  return {
    props: {
      product,
    },
    revalidate: 60 * 60 * 24, //24 hours -> gera um novo HTML a cada 24hrs
  };
};
