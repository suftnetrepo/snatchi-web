import mongoose from 'mongoose';
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');
const Integrator = require('../models/integrator');
const User = require('../models/user');
const Project = require('../models/project');
const Task = require('../models/task');
import { NextResponse } from 'next/server';

const { mongoConnect } = require('../../../utils/connectDb');

mongoConnect();
export async function GET() {
  try {
    await clearSeeds();
    await seedDatabase(); // Uncomment this if needed
    return NextResponse.json(
      { message: 'Database cleared and seeded successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in clearing or seeding database:', error);
    return NextResponse.json(
      { message: 'Failed to clear or seed database', error: error.message },
      { status: 500 }
    );
  }
}

// Function to clear seeds
const clearSeeds = async () => {
  try {
    // await Integrator.deleteMany({});
    // await User.deleteMany({});
    // await Project.deleteMany({});
    // await Task.deleteMany({});
    console.log('Existing seeds cleared');
  } catch (error) {
    console.error('Error clearing seeds:', error);
    throw error;
  }
};

const stripeStatuses = ['active', 'inactive', 'unpaid', 'canceled'];

const projectStatuses = ['Pending', 'Progress', 'Completed', 'Canceled'];
const projectPriorities = ['Low', 'Medium', 'High'];

const generateRandomProject = (integratorId) => {
  const now = new Date();

  const startDate = faker.date.between({
    from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: now, // current date
  }).getTime();

  const endDate = faker.date.between({
    from: new Date(startDate), // Use the generated startDate
    to: new Date(startDate + 30 * 24 * 60 * 60 * 1000), // 30 days ahead
  }).getTime();

  return new Project({
    name: faker.company.name(),
    manager: `${faker.person.firstName()} ${faker.person.lastName()}`,
    stakeholder: `${faker.person.firstName()} ${faker.person.lastName()}`,
    description: faker.lorem.paragraphs(2),
    startDate: startDate,
    endDate: endDate,
    status: faker.helpers.arrayElement(projectStatuses),
    priority: faker.helpers.arrayElement(projectPriorities),
    integrator: integratorId,
    budget: faker.finance.amount(1000, 10000, 2),
    address: {
      addressLine1: faker.location.streetAddress(),
      county: faker.location.state(),
      town: faker.location.city(),
      country: faker.location.country(),
      country_code: faker.location.countryCode(),
      postcode: faker.location.zipCode(),
      completeAddress: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}, ${faker.location.zipCode()}`,
      location: {
        type: 'Point',
        coordinates: [parseFloat(faker.location.longitude()), parseFloat(faker.location.latitude())]
      }
    },  
    assignedTo: Array.from({ length: 5 }, () => ({
      id: new mongoose.Types.ObjectId(), 
      name: `${faker.person.firstName()} ${faker.person.lastName()}`,
      image: faker.image.avatar(), 
      role: faker.helpers.arrayElement(['engineer', 'integrator', 'manager']) 
    }))
  });
};

const generateRandomIntegrator = () => {
  const now = new Date();

  const startDate = faker.date.between({
    from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    to: now
  });

  const endDate = faker.date.between({
    from: startDate,
    to: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
  });

  return new Integrator({
    name: faker.company.name(),
    mobile: faker.phone.number(),
    email: faker.internet.email(),
    description: faker.lorem.paragraph(),
    address: {
      addressLine1: faker.location.streetAddress(),
      county: faker.location.state(),
      town: faker.location.city(),
      country: faker.location.country(),
      country_code: faker.location.countryCode(),
      postcode: faker.location.zipCode(),
      completeAddress: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}, ${faker.location.zipCode()}`,
      location: {
        type: 'Point',
        coordinates: [parseFloat(faker.location.longitude()), parseFloat(faker.location.latitude())]
      }
    },
    push_notifications: [
      {
        title: faker.lorem.sentence(),
        message: faker.lorem.sentences(2),
        status: faker.datatype.boolean()
      }
    ],
    onboardingComplete: faker.datatype.boolean(),
    stripe_user_id: faker.string.alphanumeric(10),
    currency: faker.finance.currencySymbol(),
    tax_rate: faker.number.int({ min: 0, max: 9 }),
    startDate: startDate,
    endDate: endDate,
    trial_start: faker.date.past(),
    trial_end: faker.date.future(),
    status: faker.helpers.arrayElement(stripeStatuses),
    subscriptionId: faker.string.alphanumeric(10),
    plan: faker.commerce.productName(),
    priceId: faker.string.alphanumeric(10),
    stripeCustomerId: faker.string.alphanumeric(10),
    fcm_token: faker.string.alphanumeric(20),
    logo_url: faker.image.url(),
    logo_id: faker.string.alphanumeric(10),
    secure_url: faker.internet.url(),
    public_id: faker.string.alphanumeric(10)
  });
};

// Function to generate a random User
const generateRandomUser = async (integratorId) => {
  const password = faker.internet.password();
  const email = faker.internet.email();
  
  console.log('..................................................email', email);
  console.log('..................................................password', password);

  const hashedPassword = await bcrypt.hash(password, 10);

  return new User({
    integrator: integratorId,
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    mobile: faker.phone.number(),
    user_status: faker.datatype.boolean(),
    email: email,
    otp: faker.string.alphanumeric(6),
    role: faker.helpers.arrayElement(['admin', 'integrator', 'engineer', 'guest', 'manager']),
    visible: faker.helpers.arrayElement(['private', 'public']),
    password: hashedPassword,
    photo: {
      secure_url: faker.image.avatar(),
      public_id: faker.string.alphanumeric(10)
    }
  });
};

// Seed Integrators and Users
const seedDatabase = async () => {
  try {
    // Create 10 Integrators
    const integrators = Array.from({ length: 50 }, generateRandomIntegrator);
    const savedIntegrators = await Integrator.insertMany(integrators);

    console.log('10 Integrators successfully inserted');
   
    // Create 2 Users for each Integrator
    // for (const integrator of savedIntegrators) {
    //   const users = await Promise.all([generateRandomUser(integrator._id), generateRandomUser(integrator._id)]);
    //   await User.insertMany(users);
    //   console.log(`2 Users created for Integrator.stripe_status: ${integrator.status}`);
    //   console.log(`2 Users created for Integrator_id: ${integrator._id}`);
    // }

    // const projects = Array.from({ length: 100 }, () => {
    //   const randomIntegrator = faker.helpers.arrayElement(savedIntegrators);
    //   return generateRandomProject(randomIntegrator._id);
    // });

    //  await Project.insertMany(projects);

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};
