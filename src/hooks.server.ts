// MonitorHub Server Hooks
// Authentication and request handling

import { SvelteKitAuth } from '@auth/sveltekit';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from '@auth/sveltekit/providers/google';
import Credentials from '@auth/sveltekit/providers/credentials';
import { db } from '$lib/database';
import { config, isWhitelisted } from '$lib/config';
import bcrypt from 'bcryptjs';
import type { Handle } from '@sveltejs/kit';

export const { handle: authHandle } = SvelteKitAuth({
	adapter: PrismaAdapter(db),
	providers: [
		Google({
			clientId: config.auth.google.clientId,
			clientSecret: config.auth.google.clientSecret
		}),
		Credentials({
			name: 'credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' }
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				const email = credentials.email as string;
				const password = credentials.password as string;

				// Check beta whitelist
				if (!isWhitelisted(email)) {
					throw new Error('Registration is currently limited to beta users');
				}

				// Find user in database
				const user = await db.user.findUnique({
					where: { email }
				});

				if (!user || !user.passwordHash) {
					return null;
				}

				// Verify password
				const isValid = await bcrypt.compare(password, user.passwordHash);
				if (!isValid) {
					return null;
				}

				return {
					id: user.id,
					email: user.email,
					name: user.name,
					isAdmin: user.isAdmin
				};
			}
		})
	],
	session: {
		strategy: 'jwt'
	},
	callbacks: {
		async signIn({ user, account }) {
			// Check beta whitelist for all sign-in attempts
			if (user.email && !isWhitelisted(user.email)) {
				return false;
			}

			// For Google OAuth, create/update user record
			if (account?.provider === 'google' && user.email) {
				await db.user.upsert({
					where: { email: user.email },
					update: {
						name: user.name || '',
						googleId: account.providerAccountId
					},
					create: {
						email: user.email,
						name: user.name || '',
						googleId: account.providerAccountId,
						isActive: true
					}
				});
			}

			return true;
		},
		async jwt({ token, user }) {
			if (user) {
				token.isAdmin = (user as any).isAdmin || false;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user && token.sub) {
				session.user.id = token.sub;
				(session.user as any).isAdmin = token.isAdmin || false;
			}
			return session;
		}
	},
	secret: config.auth.secret,
	trustHost: true
});

// Combine auth with other server hooks if needed
export const handle: Handle = authHandle;