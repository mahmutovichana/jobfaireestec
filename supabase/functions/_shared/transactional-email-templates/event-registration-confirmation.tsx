import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "JobFAIR"

interface Props {
  full_name?: string
  event_name?: string
  event_date?: string
}

const EventRegistrationConfirmationEmail = ({ full_name, event_name, event_date }: Props) => (
  <Html lang="bs" dir="ltr">
    <Head />
    <Preview>Uspješna prijava na {event_name || SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={logo}>{SITE_NAME}</Heading>
        </Section>
        <Heading style={h1}>
          {full_name ? `Hvala, ${full_name}!` : 'Hvala na prijavi!'}
        </Heading>
        <Text style={text}>
          Vaša prijava{event_name ? ` za "${event_name}"` : ''} je uspješno zaprimljena.
          {event_date ? ` Događaj: ${event_date}.` : ''}
        </Text>
        <Text style={text}>
          Detalje o lokaciji i dnevnom redu poslat ćemo vam putem emaila bliže datumu događaja.
        </Text>
        <Text style={text}>
          Za pitanja nas kontaktirajte na <strong>board@eestec-sa.ba</strong>.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Srdačan pozdrav,<br />
          {SITE_NAME} Tim — EESTEC LC Sarajevo
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: EventRegistrationConfirmationEmail,
  subject: (data: Record<string, any>) =>
    data?.event_name ? `Prijava potvrđena — ${data.event_name}` : 'Prijava potvrđena',
  displayName: 'Potvrda prijave na događaj',
  previewData: { full_name: 'Amina', event_name: 'JobFAIR 2026', event_date: '15.04.2026.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 24px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { marginBottom: '24px' }
const logo = { fontSize: '24px', fontWeight: '700' as const, color: '#dc2626', margin: '0' }
const h1 = { fontSize: '20px', fontWeight: '600' as const, color: '#1a1a2e', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#555555', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', lineHeight: '1.5', margin: '0' }