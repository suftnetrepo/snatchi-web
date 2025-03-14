import {
    Html,
    Body,
    Section,
    Column,
    Text,
    Divider,
} from '@react-email/components';

const VerificationEmail = ({ name, code, contact_email, team }) => {
    return (
        <Html>
            <Body style={{ backgroundColor: '#f1f1f1' }}>
                <Section>
                    <Column></Column>
                </Section>
                <Section style={{ backgroundColor: '#fff', padding: '20px' }}>
                    <Column>
                        <Text style={{ fontSize: '30px', textAlign: 'center' }}>
                            Your Code for Verification
                        </Text>
                        <Divider
                            style={{
                                borderColor: '#06adef',
                                width: '100px',
                                margin: '20px auto',
                            }}
                        />
                        <Text
                            style={{
                                fontSize: '18px',
                                textAlign: 'left',
                                color: '#555',
                                lineHeight: '30px',
                            }}
                        >
                            Hi {name},
                            <p>
                                <br />
                                Your Code for verification is:
                                <h3>{code}</h3>
                                If you're not sure why you're receiving this message, you can
                                report it to us by emailing {contact_email}.
                            </p>
                            <p>
                                Sincerely,
                                <br />
                                {team}
                            </p>
                        </Text>
                    </Column>
                </Section>
            </Body>
        </Html>
    );
};


export { VerificationEmail  }
