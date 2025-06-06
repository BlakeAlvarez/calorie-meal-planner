﻿// <auto-generated />
using System;
using MealPrepApi.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace MealPrepApi.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20250602162619_AddPeopleSummaryToMeals")]
    partial class AddPeopleSummaryToMeals
    {
        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder.HasAnnotation("ProductVersion", "9.0.5");

            modelBuilder.Entity("MealPrepApi.Models.Meal", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("TEXT");

                    b.Property<string>("CreatedBy")
                        .HasColumnType("TEXT");

                    b.Property<string>("FoodsJson")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<string>("GroupsJson")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<bool>("IsShared")
                        .HasColumnType("INTEGER");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<string>("Notes")
                        .HasColumnType("TEXT");

                    b.Property<int?>("PeopleCount")
                        .HasColumnType("INTEGER");

                    b.Property<string>("PeopleJson")
                        .HasColumnType("TEXT");

                    b.Property<int?>("TotalCalories")
                        .HasColumnType("INTEGER");

                    b.Property<int?>("TotalMeals")
                        .HasColumnType("INTEGER");

                    b.HasKey("Id");

                    b.ToTable("Meals");
                });
#pragma warning restore 612, 618
        }
    }
}
