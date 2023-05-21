import { NextApiRequest, NextApiResponse } from 'next';
import { query as q } from 'faunadb';
import { stripe } from '../../services/stripe';
import { getSession } from 'next-auth/react';
import { fauna } from '../../services/fauna';

type User = {
  ref: {
    id: string;
  };
  data: {
    stripe_customer_id: string;
  };
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  //verificando se metodo de requisiçao é do tipo POST
  if (req.method === 'POST') {
    // recuperando dados do user logado no app
    const session = await getSession({ req });

    const user = await fauna.query<User>(
      q.Get(q.Match(q.Index('user_by_email'), q.Casefold(session.user.email)))
    );

    let customerId = user.data.stripe_customer_id;

    // Cadastrando um customer no stripe caso ele ainda n exista
    if (!customerId) {
      const stripeCustomer = await stripe.customers.create({
        email: session.user.email,
        // metadata:
      });

      // SALVANDO ID DO CUSTOMER NO STRIPE NO DB DO FAUNA

      await fauna.query(
        q.Update(q.Ref(q.Collection('users'), user.ref.id), {
          data: {
            stripe_customer_id: stripeCustomer.id,
          },
        })
      );

      customerId = stripeCustomer.id;
    }

    const stripeCheckoutSession = await stripe.checkout.sessions.create({
      customer: customerId, //passando id do usuario no stripe
      payment_method_types: ['card'], // tipo de pagamento aceitado
      billing_address_collection: 'required', // definindo endereço do user como obrigatorio
      line_items: [
        {
          price: 'price_1N8WJkGOpDEJfbtJXhVIywN9',
          quantity: 1,
        }, // definindo preço e quantidade do item no carrinho
      ],
      mode: 'subscription', // definindo pagamento como inscrição mensal
      allow_promotion_codes: true, //permitindo a criação de cupons de desconto
      success_url: process.env.STRIPE_SUCCESS_URL, //redirecionado user caso operação seja um sucesso
      cancel_url: process.env.STRIPE_CANCEL_URL, //redirecionando user caso ele cancele a requisição / erro
    });

    return res.status(200).json({ sessionId: stripeCheckoutSession.id });
  } else {
    // devolvendo resposta caso metodo n seja post
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method not allowed'); //Metodo nao permitido
  }
};
