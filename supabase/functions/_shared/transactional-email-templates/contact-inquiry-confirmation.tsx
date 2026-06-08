import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "JobFAIR"

interface ContactConfirmationProps {
  company_name?: string
  contact_person?: string
}

const ContactInquiryConfirmationEmail = ({ company_name, contact_person }: ContactConfirmationProps) => (
  <Html lang="bs" dir="ltr">
    <Head />
    <Preview>Hvala na interesovanju za {SITE_NAME}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={logo}>{SITE_NAME}</Heading>
        </Section>
        <Heading style={h1}>
          {contact_person ? `Hvala, ${contact_person}!` : 'Hvala na interesovanju!'}
        </Heading>
        <Text style={text}>
          Primili smo vaš upit{company_name ? ` u ime kompanije ${company_name}` : ''} za učešće na {SITE_NAME}-u. Naš tim će pregledati vaš zahtjev i kontaktirati vas u najkraćem mogućem roku.
        </Text>
        <Text style={text}>
          Ukoliko imate dodatnih pitanja, slobodno nas kontaktirajte na <strong>board@eestec-sa.ba</strong>.
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
  component: ContactInquiryConfirmationEmail,
  subject: 'Hvala na interesovanju za JobFAIR!',
  displayName: 'Potvrda upita kompanije',
  previewData: { company_name: 'Acme d.o.o.', contact_person: 'Amina' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 24px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { marginBottom: '24px' }
const logo = { fontSize: '24px', fontWeight: '700' as const, color: '#dc2626', margin: '0' }
const h1 = { fontSize: '20px', fontWeight: '600' as const, color: '#1a1a2e', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#555555', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', lineHeight: '1.5', margin: '0' }
